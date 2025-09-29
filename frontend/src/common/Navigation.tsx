import React, { useState, useRef, useEffect } from "react";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { sections, components } from "../Config";
import { IoMdLogOut } from "react-icons/io";
import type { PanelItem } from "../Config";
import { useAll } from "../context/AllContext";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {auth}=useAll();
  // Close panel on outside click (desktop + mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNavigate = (route: string) => {
    navigate(route);
    setIsOpen(false); // close panel after navigation
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          fixed bottom-5 right-5 z-50
          bg-gradient-to-r from-blue-500 to-indigo-600  /* gradient background */
          text-white          /* white icon color for contrast */
          shadow-2xl          /* stronger shadow for better separation */
          hover:from-blue-600 hover:to-indigo-700  /* hover gradient effect */
          transition-all duration-300 ease-in-out   /* smooth transition */
          flex items-center justify-center           /* center icon nicely */
        "      
        style={{padding: "5px", borderRadius: "9px", cursor: "pointer"}}
        >
        {isOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
      </button>

      {/* Overlay for mobile only */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed z-50 bg-white shadow-xl transition-transform duration-300
          ${isOpen ? "translate-y-0" : "translate-y-full md:translate-x-full"}
          w-full md:w-64 h-64 md:h-full
          bottom-0 md:top-0 md:right-0
          md:flex md:flex-col
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800" style={{padding: '7px', userSelect: "none"}}>Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-800"
            style={{padding: "7px", cursor: "pointer"}}
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        {/* Sections */}
        <div className="p-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 64px)', padding: "7px"}}>
          {Object.values(sections).map((sectionName) => (
            <div key={sectionName} className="mb-4" style={{padding: '7px'}}>
              <h3 className="font-medium text-gray-800 mb-2" style={{userSelect: "none"}}>{sectionName}</h3>
              <ul className="pl-2 space-y-1">
                {components
                  .filter((item: PanelItem) => item.section === sectionName)
                  .map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center text-gray-00 hover:text-primary cursor-pointer space-x-2"
                      onClick={() => handleNavigate(item.route)}
                      style={{marginTop:"7px", userSelect: "none"}}
                    >
                      {item.icon &&
                        React.isValidElement(item.icon)
                          ? React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })
                          : item.icon
                      }
                      <span style={{marginLeft: "7px"}}>{item.name}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 right-4">
          <button
          style={{padding: "3px", cursor: "pointer", userSelect: "none"}}
          onClick={auth.logout}
            className="
              bg-red-800 text-white
              hover:bg-red-600
              transition-colors
              py-2 px-4
              rounded-md
              flex items-center justify-center
            "
          >
            <IoMdLogOut size={25}/>
          </button>
        </div>
      </div>
    </>
  );
}
