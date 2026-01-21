import { LucideEye, LucideHome, LucideSearch, LucideSmile } from 'lucide-react'
// import React from 'react'
import i1 from "../images/Charis_Solomou_3.jpg";
import i2 from "../images/images.jpg";
import i3 from "../images/modernist-decor-inspiration-01.webp";
import i4 from "../images/Shinkenchiku_Sha_2.jpg";
import i5 from "../images/648c6fbc2b4da9c936d70d0468d6d880.jpg";

const Qualities = () => {
    return (
        <div>
            <div className="container mx-auto p-8 bg-white px-20 text-black">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="md:w-1/2 mb-8 md:mb-0">
                        <img src={i5} alt="img" className="rounded-md" />

                    </div>
                    <div className="md:w-1/2">
                        <h2 className="text-3xl font-bold mb-4">Best rated host on popular rental sites</h2>
                        <p className="text-gray-600">
                            Our platform is trusted by thousands of clients who have found their dream properties with us. We pride ourselves on providing exceptional customer service and ensuring that our clients have a seamless experience.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between mb-16">
                    <div className="md:w-1/2 mb-8 md:mb-0">
                        <h1 className="text-4xl font-bold mb-4">Simple & easy way to find your dream property</h1>
                        <p className="text-gray-600 mb-6">
                            Our platform provides a seamless experience for clients to find their ideal property. With a user-friendly interface and advanced search features, you can easily browse through a wide range of properties and find the one that suits your needs.
                        </p>
                        <button className="bg-black text-white py-2 px-4 rounded">Get Started</button>
                    </div>
                    <div className="md:w-1/2 grid grid-cols-2 gap-4">
                        <img src={i1} alt="img" className="rounded-md" />
                        <img src={i3} alt="img" className="rounded-md" />
                        <img src={i4} alt="img" className="rounded-md" />
                        <img src={i2} alt="img" className="rounded-md" />

                    </div>
                </div>
            </div>
            <div className="bg-white text-slate-800  flex flex-col items-center">
                <div className="flex flex-col md:flex-row items-center justify-center mt-10 space-y-4 md:space-y-0 md:space-x-4 pb-5">
                    <div className="bg-slate-200 p-8 rounded-lg shadow-md w-full md:w-1/2">
                        <h2 className="text-2xl font-bold mb-4">Simple & easy way to find your dream Appointment</h2>
                        <p className="text-black mb-6">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                        <button className="bg-black text-white px-4 py-2 rounded">Get Started
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full md:w-1/2  ">
                        <div className="bg-slate-200 p-4 rounded-lg shadow-md flex items-center h-40">
                            <LucideSearch />
                            <span>Search your location</span>
                        </div>
                        <div className="bg-slate-200 p-4 rounded-lg shadow-md flex items-center">
                            <LucideEye />
                            <span>Visit Appointment</span>
                        </div>
                        <div className="bg-slate-200 p-4 rounded-lg shadow-md flex items-center">
                            <LucideHome />
                            <span>Get your dream house</span>
                        </div>
                        <div className="bg-slate-200 p-4 rounded-lg shadow-md flex items-center">
                            <LucideSmile />
                            <span>Enjoy your Appointment</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Qualities
