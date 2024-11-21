import { useEffect, useRef, useState } from "react";
import "../../DoctorMeetingConference.scss";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import axios from "axios";
import { useParams } from "react-router-dom";

const DoctorMeetingConference = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [roomID, setRoomID] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error state
  const sidebarRef = useRef(null);
  const { appointmentId } = useParams();

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleClickOutside = (event) => {
    if (
      isSidebarOpen &&
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target)
    ) {
      closeSidebar();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Fetch roomID from the backend using the appointment ID
  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true); // Start loading
      const response = await axios.get(
        `https://patient-management-system-kshy.onrender.com/api/appointments/${appointmentId}`
      );
      const appointmentData = response.data.data;

      if (!appointmentData.roomID) {
        throw new Error("Room ID is not available in the appointment data");
      }

      setRoomID(appointmentData.roomID);
      setUserName(appointmentData.doctorName);
    } catch (err) {
      console.error("Error fetching appointment details:", err);
      setError("Failed to fetch appointment details. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const initZegoCloudMeeting = async (element) => {
    try {
      const appID = 1757979495;
      const serverSecret = "04f46682ad34e9005b14d629441180e3";
      const userID = Date.now().toString(); // Generate unique user ID

      if (!roomID) {
        throw new Error("Room ID is not available");
      }

      // Generate the Zego kit token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );
      const zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: element,
        sharedLinks: [
          {
            name: "Personal link",
            url:
              window.location.protocol +
              "//" +
              window.location.host +
              window.location.pathname +
              "?roomID=" +
              roomID,
          },
        ],
        roomID: roomID,
        userID: userID,
        userName: userName,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        onUserAvatarSetter: (userList) => {
          userList.forEach((user) => {
            user.setUserAvatar("/assets/images/Avatar-2.png");
          });
        },
      });
    } catch (err) {
      console.error("Error initializing Zego Cloud Meeting:", err);
      setError("Failed to initialize the meeting. Please try again.");
    }
  };

  useEffect(() => {
    fetchAppointmentDetails(); // Fetch the appointment details on load
  }, [appointmentId]);

  useEffect(() => {
    const videoCallDiv = document.getElementById("video-call-container");
    if (videoCallDiv && roomID) {
      initZegoCloudMeeting(videoCallDiv); // Initialize the meeting once room ID is available
    }
  }, [roomID]);

  return (
    <div className="d-flex">
      <div className="w-85 w-md-100">
        <div className="container-fluid meeting-conference-page py-4">
          <h4 className="meeting-conference-title">
            Patient Meeting Conference
          </h4>

          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div
              id="video-call-container"
              className="video-call-container"
              style={{
                width: "100%",
                height: "100vh",
                backgroundColor: "#718EBF",
              }}
            ></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorMeetingConference;
