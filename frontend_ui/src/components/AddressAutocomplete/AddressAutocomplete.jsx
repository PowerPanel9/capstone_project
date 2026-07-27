// AddressAutocomplete: a reusable location input with a dropdown of real
// addresses. As the user types, we ask the backend for matching addresses
// (which come from LocationIQ) and show them in a list. The user MUST pick one
// of the options for the address to count as "valid". If they type something
// and don't pick a suggestion, the parent form can show an error and block
// saving.
//
// Props:
//   value       - the current text in the input (controlled by the parent)
//   onChange    - called as (nextText, isValid). isValid is true only after the
//                 user picks a suggestion from the dropdown.
//   placeholder - placeholder text for the input
//   inputId     - id for the <input>, so a <label htmlFor> can point at it
//   variant     - "onboarding" (default) shows the map-pin box used in the
//                 onboarding flow. "modal" renders a plain input so it matches
//                 the other inputs inside the Edit Profile modal.
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { getAddressSuggestions } from "../../api/users";
import "./AddressAutocomplete.css";

function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  inputId,
  variant = "onboarding",
}) {
  // The list of address options currently shown in the dropdown.
  const [suggestions, setSuggestions] = useState([]);
  // Whether the dropdown is open (we hide it after a pick or when empty).
  const [isOpen, setIsOpen] = useState(false);
  // Small "Searching…" hint while we wait for the backend.
  const [isLoading, setIsLoading] = useState(false);
  // A message shown in the dropdown when the request fails, so the user (and
  // we) can see WHY no suggestions appeared instead of a silent blank.
  const [fetchError, setFetchError] = useState("");

  // Ref to the whole component so we can close the dropdown on outside clicks.
  const containerRef = useRef(null);
  // Remembers the last address the user actually PICKED. If the text still
  // matches this, the address is considered valid.
  const pickedLabelRef = useRef(value || "");

  // Close the dropdown when the user clicks anywhere outside this component.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // When the user types, report the new text as NOT valid yet. Any typing after
  // a pick means the value no longer matches a chosen address, so we mark it
  // invalid until they pick again from the dropdown.
  const handleInputChange = (event) => {
    onChange(event.target.value, false);
  };

  // Fetch suggestions whenever the text changes, using a debounce timer. We
  // "debounce" so that instead of calling the API on every keystroke, we wait
  // 300ms after the user stops typing.
  useEffect(() => {
    // An empty box (or the unchanged picked value) doesn't need a fetch.
    const trimmed = (value || "").trim();
    if (trimmed.length < 3 || trimmed === pickedLabelRef.current) {
      setSuggestions([]);
      setIsLoading(false);
      setFetchError("");
      return;
    }

    let ignore = false;
    setIsLoading(true);
    setFetchError("");

    const timerId = setTimeout(async () => {
      try {
        const results = await getAddressSuggestions(trimmed);
        if (ignore) return;
        setSuggestions(results);
        setFetchError("");
        setIsOpen(true);
      } catch (error) {
        // Show the problem instead of hiding it: open the dropdown with a short
        // error message so the user knows suggestions failed to load.
        if (!ignore) {
          setSuggestions([]);
          setFetchError("Couldn't load address suggestions. Please try again.");
          setIsOpen(true);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }, 300);

    // Cleanup cancels the timer if the user types again before 300ms, and
    // ignores a late response if the text already changed.
    return () => {
      ignore = true;
      clearTimeout(timerId);
    };
  }, [value]);

  // The user picked an address from the dropdown: remember it as the valid
  // value, close the list, and tell the parent the value is now valid.
  const handleSelect = (suggestion) => {
    pickedLabelRef.current = suggestion.label;
    onChange(suggestion.label, true);
    setSuggestions([]);
    setFetchError("");
    setIsOpen(false);
  };

  // Shared props so the input looks and behaves the same in both variants.
  const inputProps = {
    id: inputId,
    type: "text",
    value,
    onChange: handleInputChange,
    onFocus: () => {
      if (suggestions.length > 0 || fetchError) setIsOpen(true);
    },
    placeholder,
    autoComplete: "off",
  };

  // The dropdown shows while it's open and there is something to show.
  const showDropdown =
    isOpen && (suggestions.length > 0 || isLoading || Boolean(fetchError));

  return (
    <div className="address-autocomplete" ref={containerRef}>
      {variant === "modal" ? (
        // Plain input: inherits the modal's input styling so it matches the
        // Bio / Resume / Certification fields around it.
        <input {...inputProps} />
      ) : (
        // Onboarding look: a bordered box with a map-pin icon inside.
        <div className="ob-input-wrap">
          <MapPin size={20} className="ob-input-icon" />
          <input {...inputProps} />
        </div>
      )}

      {showDropdown && (
        <ul className="address-suggestions" role="listbox">
          {fetchError ? (
            <li className="address-suggestion-error">{fetchError}</li>
          ) : isLoading && suggestions.length === 0 ? (
            <li className="address-suggestion-hint">Searching…</li>
          ) : (
            suggestions.map((suggestion) => (
              <li key={suggestion.label} role="option" aria-selected="false">
                <button
                  type="button"
                  className="address-suggestion-btn"
                  onClick={() => handleSelect(suggestion)}
                >
                  {suggestion.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default AddressAutocomplete;
