# Notes
- Do not run dev server if i dont command.
- If for Website UI , create seperate class name and components to create different CSS for mobile and desktop screen size. (For example : <div classname ="mobile-card"> or <div classname ="desktop-card"> in CSS , use display = hidden for each screen type using @media constraint.)

## UI Redesign Workflow

When the user asks to redesign a page or work with UI:

Only do the following if user didn't give you reference UI or UI description.

1. Inspect the existing React page/component using filesystem access.
2. Identify:
   - page purpose
   - fields
   - buttons
   - tables
   - modals
   - filters
   - loading states
   - empty states
   - validation errors
   - API request payloads
   - API response shape
   - permission/feature flag behavior
   - current user workflow

3. Build a Stitch design prompt containing:
   - current UI composition detail
   - screen purpose
   - data request/response examples
   - UI workflow
   - layout requirements
   - design style
   - responsive behavior

4. Use Stitch MCP to generate the redesigned UI.

5. Download or fetch the generated HTML resource from Stitch.

6. Use the Stitch HTML only as visual/UI reference.

7. Implement the page in the existing React codebase:
   - keep existing API calls
   - keep existing hooks
   - keep existing validation
   - keep route guards
   - keep permission checks
   - keep business logic
   - only update layout, components, className, spacing, and visual hierarchy

8. After implementation:
   - run type check/lint if available
   - summarize changed files
   - mention any UI behavior preserved
   - mention any Stitch design assumptions

## Do Not
- Do not replace React logic with raw Stitch HTML.
- Do not remove API integration.
- Do not change backend endpoints.
- Do not change permission logic.
- Do not change validation rules unless explicitly requested.
- Do not run dev server if i dont command.