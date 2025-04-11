import React from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Users, LineChart, Sparkles } from "lucide-react";
import { AuthProvider } from "@/lib/auth";
import AuthForm from "./auth/AuthForm";
import SEO from "./SEO";
import { WebsiteStructuredData, OrganizationStructuredData } from "./StructuredData";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Share & Connect",
      description: "Share your prayer requests in a supportive community",
      icon: Heart,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Community Support",
      description: "Join others in prayer and show support",
      icon: Users,
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      title: "Track Progress",
      description: "Monitor and celebrate answered prayers",
      icon: LineChart,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "AI-Powered Insights",
      description: "Get personalized spiritual insights",
      icon: Sparkles,
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <SEO
        title="CryOutNow - Share Your Prayer Requests"
        description="Connect with a supportive community to share and receive prayers. CryOutNow helps you share your prayer requests and pray for others."
        canonical="/"
      />
      <WebsiteStructuredData
        url="https://cryoutnow.com"
        name="CryOutNow"
        description="A supportive community for sharing and receiving prayers"
      />
      <OrganizationStructuredData
        url="https://cryoutnow.com"
        name="CryOutNow"
        logo="https://cryoutnow.com/logo.png"
        description="CryOutNow is a platform where people can share their prayer requests and pray for others in a supportive community."
      />
      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                CryOutNow
              </span>
            </div>
            <div></div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block text-gray-900">Welcome to</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                  CryOutNow
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                A Christian community platform for sharing and supporting prayer
                requests.
              </p>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full">
                <AuthForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative bg-gray-50 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Elevate Your Prayer Experience
          </h2>
          <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">
            Discover a new way to connect, share, and grow in your faith journey
          </p>
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="pt-6">
                    <div className="flow-root rounded-lg bg-white px-6 pb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="-mt-6">
                        <div
                          className={`inline-flex items-center justify-center rounded-md bg-gradient-to-r ${feature.gradient} p-3 shadow-lg`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-8 text-lg font-medium tracking-tight text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="mt-5 text-base text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
