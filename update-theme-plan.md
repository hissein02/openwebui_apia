Theme Customization Plan
I will update the application's color theme to match your school's palette (Blue-ish Dark Mode).

Proposed Changes
Configuration
[MODIFY] 
tailwind.config.js
Update the hexadecimal fallback values for the gray color palette to match your provided school colors.
Styles
[MODIFY] 
app.css
Add the CSS variable definitions (--color-gray-50 to --color-gray-950) to the :root selector. This ensures consistency and allows the variables to be used directly in CSS if needed.
Verification Plan
Manual Verification
Visual Check: Build/Run the application and verify that the UI colors have changed.
Light Mode: Check backgrounds and texts that use gray-50 to gray-200.
Dark Mode: Check backgrounds (which use gray-800/900). They should now appear blue-ish (#0055A4, #003F7D) instead of neutral gray/black.
Code Check: Verify that 
tailwind.config.js
 contains the new hex codes.
