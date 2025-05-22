
import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  const activeClassName = "bg-sky-700 text-white";
  const inactiveClassName = "text-sky-100 hover:bg-sky-600 hover:text-white";

  return (
    <nav className="bg-sky-800 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold text-white">
          Dairy Manager
        </NavLink>
        <div className="space-x-2">
          {[
            {to: "/", label: "Farmers"}, 
            {to: "/entry", label: "Milk/Payment Entry"}, 
            {to: "/rates", label: "Lactometer Rates"}, 
            {to: "/reports", label: "Reports"},
            {to: "/summary-report", label: "Summary Report"} // New Link
          ].map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `${isActive ? activeClassName : inactiveClassName} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
