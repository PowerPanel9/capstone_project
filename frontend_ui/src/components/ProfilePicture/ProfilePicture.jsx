import './ProfilePicture.css';

const avatarColors = {
  MC: { background: "#DBEAFE", color: "#1D4ED8" },
  SM: { background: "#FCE7F3", color: "#BE185D" },
  JL: { background: "#CCFBF1", color: "#0F766E" },
  EP: { background: "#FEF3C7", color: "#B45309" },
  DK: { background: "#CFFAFE", color: "#0E7490" },
  PN: { background: "#FFE4E6", color: "#BE123C" },
  TG: { background: "#FFEDD5", color: "#C2410C" },
  AR: { background: "#ECEDF8", color: "#6678B8" }
};

function ProfilePicture({ initials, size = "md" }) {
  const sizeClass = `avatar-${size}`;
  const colors = avatarColors[initials] ?? { background: "#ECEDF8", color: "#6678B8" };

  return (
    <div className={`avatar ${sizeClass}`} style={colors}>
      {initials}
    </div>
  );
}

export default ProfilePicture;
