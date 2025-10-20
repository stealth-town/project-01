import { useNavigate } from 'react-router-dom';

interface NavigationArrowProps {
  to: string;
  label: string;
}

export function NavigationArrow({ to, label }: NavigationArrowProps) {
  const navigate = useNavigate();

  return (
    <div className="navigation-arrow" onClick={() => navigate(to)}>
      <div className="arrow-content">
        <div className="arrow-label"><b>{label}</b></div>
        <div className="arrow-icon">→</div>
      </div>
    </div>
  );
}
