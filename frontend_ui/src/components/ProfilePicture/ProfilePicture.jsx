import './ProfilePicture.css';

const avatarColors = {
  MC: { background: "#DBEAFE", color: "#1D4ED8" },
  SM: { background: "#FCE7F3", color: "#BE185D" },
  JL: { background: "#CCFBF1", color: "#0F766E" },
  EP: { background: "#FEF3C7", color: "#B45309" },
  DK: { background: "#CFFAFE", color: "#0E7490" },
  PN: { background: "#FFE4E6", color: "#BE123C" },
  TG: { background: "#FFEDD5", color: "#C2410C" },
  AR: { background: "#F3F4F6", color: "#4B5563" }
};

// `src` is an optional real profile picture URL. When given, it's shown as a
// cover-fit background image instead of the initials fallback — same
// approach the profile header's own avatar already uses.
function ProfilePicture({ initials, size = "md", src }) {
  const sizeClass = `avatar-${size}`;
  const colors = avatarColors[initials] ?? { background: "#F3F4F6", color: "#4B5563" };
  const trimmedSrc = typeof src === "string" ? src.trim() : "";

  return (
    <div
      className={`avatar ${sizeClass}`}
      style={
        trimmedSrc
          ? { backgroundImage: `url("${trimmedSrc}")`, backgroundSize: "cover", backgroundPosition: "center" }
          : colors
      }
    >
      {!trimmedSrc && initials}
    </div>
  );
}

export default ProfilePicture;
