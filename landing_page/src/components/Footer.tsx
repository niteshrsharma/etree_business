import React from "react";


export default function Footer() {
    return (
        <footer className="py-10 text-center bg-gray-900 text-white mt-20">
            <p className="text-lg">© {new Date().getFullYear()} SkillConnect — Bringing Pune Together.</p>
        </footer>
    );
}