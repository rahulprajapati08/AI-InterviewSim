// components/RecruiterAvatar.tsx
import React from "react";
import "./RecruiterAvatar.css";

const RecruiterAvatar = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className="recruiter-avatar">
      <img
        src="src/recruiter.png" // make sure this image is in public folder
        alt="Recruiter"
        className="avatar-img"
      />
      <div className="avatar-name">Alex</div>
      <div className={`voice-bars ${isSpeaking ? "active" : ""}`}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
    </div>
  );
};

export default RecruiterAvatar;
