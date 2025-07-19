// src/components/mode-toggle.tsx
import { useTheme } from "@/components/theme-provider"; // Ensure this path is correct

export function ModeToggle() {
  // We now need both the current 'theme' and the 'setTheme' function
  const { theme, setTheme } = useTheme();

  // This function will toggle the theme
  const toggleTheme = () => {
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      // If current theme is dark (or system is dark), switch to light
      setTheme("light");
    } else {
      // If current theme is light (or system is light), switch to dark
      setTheme("dark");
    }
    // You could also add a console.log here to see if toggleTheme is called
    // console.log("Toggling theme. Current:", theme, "New:", theme === "dark" ? "light" : "dark");
  };

  // Determine which icon to show based on the current theme state
  const currentIcon = (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches))
    ? "light_mode" // Show light mode icon when currently dark
    : "dark_mode"; // Show dark mode icon when currently light

  const titleText = (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches))
    ? "Switch to light mode"
    : "Switch to dark mode";

  return (
    <div className="relative">
      <span
        onClick={toggleTheme} // Call the toggle function on click
        className="material-icons cursor-pointer text-sm text-gray-400" // No hidden/block classes needed on these spans anymore
        title={titleText}
      >
        {currentIcon} {/* Dynamically render the correct icon name */}
      </span>
    </div>
  );
}