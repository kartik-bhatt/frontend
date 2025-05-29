import React from "react";
import { FaLinkedin, FaGithub, FaTwitter } from "react-icons/fa";

const teamMembers = [
  {
    name: "Alice Johnson",
    role: "Frontend Developer",
    image: "https://i.pravatar.cc/150?img=32",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
  {
    name: "Bob Smith",
    role: "Backend Developer",
    image: "https://i.pravatar.cc/150?img=14",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
  {
    name: "Carol Martinez",
    role: "UI/UX Designer",
    image: "https://i.pravatar.cc/150?img=20",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
  {
    name: "David Kim",
    role: "DevOps Engineer",
    image: "https://i.pravatar.cc/150?img=36",
    linkedin: "#",
    github: "#",
    twitter: "#",
  },
];

const Team = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Meet the Team</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamMembers.map((member, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center hover:shadow-xl transition-shadow"
          >
            <img
              src={member.image}
              alt={member.name}
              className="w-24 h-24 rounded-full mb-4 object-cover"
            />
            <h2 className="text-xl font-semibold">{member.name}</h2>
            <p className="text-gray-500">{member.role}</p>
            <div className="flex gap-4 mt-4 text-gray-600">
              <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="hover:text-blue-600" />
              </a>
              <a href={member.github} target="_blank" rel="noopener noreferrer">
                <FaGithub className="hover:text-gray-800" />
              </a>
              <a href={member.twitter} target="_blank" rel="noopener noreferrer">
                <FaTwitter className="hover:text-blue-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
