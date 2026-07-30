import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getExperienceById } from "../../api/experiences";
import "./ExperienceDetailView.css";

// Shows a single experience in full: all its images, the title, the
// description, and who posted it. The poster's name links to their profile.
function ExperienceDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the experience when the page opens (or the id changes). `ignore`
  // stops a late response from updating state after we've navigated away.
  useEffect(() => {
    let ignore = false;

    getExperienceById(id)
      .then((data) => {
        if (!ignore) setExperience(data);
      })
      .catch((err) => {
        console.error("Failed to load experience:", err);
        if (!ignore) setError("Could not load this experience.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (isLoading) return <p className="feed-status">Loading experience…</p>;
  if (error) return <p className="feed-status feed-error">{error}</p>;
  if (!experience) return <p className="feed-status">Experience not found.</p>;

  const poster = experience.user || {};
  const posterName =
    `${poster.firstName || ""} ${poster.lastName || ""}`.trim() || "Unknown";
  const images = Array.isArray(experience.images) ? experience.images : [];

  return (
    <div className="experience-detail">
      <button className="experience-detail-back" onClick={() => navigate("/home")}>
        <ArrowLeft size={15} />
        Back to home
      </button>

      <h1 className="experience-detail-title">{experience.jobTitle}</h1>

      {/* The poster's name links to their public profile. */}
      <button
        type="button"
        className="experience-detail-poster"
        onClick={() => poster.id && navigate(`/users/${poster.id}`)}
      >
        Posted by {posterName}
      </button>

      <p className="experience-detail-description">{experience.description}</p>

      {images.length > 0 && (
        <div className="experience-detail-images">
          {images.map((imageSrc, index) => (
            <img
              key={`${experience.id}-${index}`}
              src={imageSrc}
              alt={`${experience.jobTitle} ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExperienceDetailView;
