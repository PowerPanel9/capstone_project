// Stepper: the "STEP x OF y" progress bar at the top of each onboarding page.
// It matches the Figma design: each step is a small bar. Completed/current
// steps show a wide coloured bar; upcoming steps show a narrow grey bar.
//
// Props:
//   current -> which step we are on (1-based)
//   total   -> how many steps this flow has (3 for client, 5 for provider)
//   accent  -> the colour for the filled bars (teal or purple hex string)
import './Stepper.css';

function Stepper({ current, total, accent }) {
  // Build an array like [1, 2, 3, ...] so we can render one bar per step.
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <div className="stepper">
      {steps.map((step) => {
        const isDone = step <= current;
        return (
          <span
            key={step}
            className={`stepper-bar ${isDone ? 'stepper-bar-done' : ''}`}
            // Filled bars use the flow's accent colour.
            style={isDone ? { background: accent } : undefined}
          />
        );
      })}
      <span className="stepper-label">
        STEP {current} OF {total}
      </span>
    </div>
  );
}

export default Stepper;
