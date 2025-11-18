import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";


export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);


    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);


    return (
        <motion.header
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 inset-x-0 z-50 backdrop-blur ${scrolled ? "bg-white/80 shadow-sm" : "bg-transparent"
                }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 flex items-center justify-between">
                    {/* Brand */}
                    <a href="#" className="inline-flex items-center gap-2">
                        <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            SkillConnect
                        </span>
                    </a>


                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-8 text-[15px] font-medium">
                        <a href="#services" className="hover:text-blue-600 transition">Services</a>
                        <a href="#how" className="hover:text-blue-600 transition">How it works</a>
                        <a
                            href="#register"
                            className="inline-flex items-center rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow"
                        >
                            Register
                        </a>
                    </div>


                    {/* Mobile menu toggle */}
                    <button
                        aria-label="Toggle menu"
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        onClick={() => setOpen((v) => !v)}
                    >
                        {open ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>


                {/* Mobile sheet */}
                <motion.div
                    initial={false}
                    animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                    className="md:hidden overflow-hidden"
                >
                    <div className="flex flex-col gap-2 pb-4">
                        <a href="#services" className="px-2 py-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(false)}>
                            Services
                        </a>
                        <a href="#how" className="px-2 py-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(false)}>
                            How it works
                        </a>
                        <a
                            href="#register"
                            className="mt-1 inline-flex items-center justify-center rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow"
                            onClick={() => setOpen(false)}
                        >
                            Register
                        </a>
                    </div>
                </motion.div>
            </nav>
        </motion.header>
    );
}