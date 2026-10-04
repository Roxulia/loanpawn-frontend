import { Link, useLocation, useNavigate } from "react-router";
import "./module-navigation.css";

export type ModuleNavigationItem = {
  label: string;
  to: string;
};

export function ModuleNavigation({
  items,
  label,
}: {
  items: ModuleNavigationItem[];
  label: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  // Prefer the most specific destination so detail routes keep their section highlighted.
  const activeItem = [...items]
    .sort((first, second) => second.to.length - first.to.length)
    .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) ?? items[0];

  return (
    <nav className="module-navigation" aria-label={label}>
      <div className="module-navigation__desktop">
        {items.map((item) => {
          const isActive = item.to === activeItem.to;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "module-navigation__link module-navigation__link--active" : "module-navigation__link"}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <label className="module-navigation__mobile">
        <span>{label}</span>
        <select value={activeItem.to} onChange={(event) => navigate(event.target.value)}>
          {items.map((item) => <option key={item.to} value={item.to}>{item.label}</option>)}
        </select>
      </label>
    </nav>
  );
}