import React from "react";
import { motion } from "framer-motion";


export default function Hero() {
    return (
        <section className="relative pt-40 pb-32 px-8 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-blue-100 blur-3xl opacity-50 -z-10"></div>


            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-extrabold max-w-4xl leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
                Empowering Pune's Talent, One Connection at a Time
            </motion.h2>


            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mt-6 max-w-2xl text-xl text-gray-700"
            >
                Discover skilled individuals, artists, and companions ready to help the community.
            </motion.p>


            <motion.a
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                href="#register"
                className="mt-10 px-8 py-4 bg-blue-600 text-white text-xl rounded-2xl shadow-xl hover:bg-blue-700 transition-all"
            >
                Get Started
            </motion.a>
        </section>
    );
}