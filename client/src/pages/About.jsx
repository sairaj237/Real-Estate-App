import React from 'react'

export default function About() {
  return (
                <main className="text-center py-16 bg-white px-52">
                <h1 className="text-4xl font-bold text-gray-900">Reimagining real estate to make it easier to unlock.</h1>
                <p className="text-gray-600 mt-4">On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment.</p>
                <div className="container mx-auto p-8 text-balck ">
                    <div className="text-center ">
                        <h2 className="text-2xl font-bold mb-4  text-black">Our vision is simple.</h2>
                        <p className="text-gray-600 mb-4">
                            Lorem Ipsum is simply dummy text of the printing and typesetting industry. In a free hour, On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment.
                            In a free hour, On the other hand, we denounce with righteous indignation and dislike men.
                        </p>
                    </div>
                    <div className="mt-16">
                        <h2 className="text-center text-2xl font-bold mb-8 text-black">Team members</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center items-center text ">
                            {[
                                { name: "kedar Kolase" },
                                { name: "Dattaraj Jadhav"},
                                { name: "Pranav Dhebe" },
                                { name: "Sairaj Magdum" },
                            ].map((member, index) => (
                                <div key={index} className="text-center">
                                    <p className="text-gray-800 font-bold">{member.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
  )
}
