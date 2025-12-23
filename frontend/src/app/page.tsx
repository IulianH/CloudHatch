import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to CloudHatch
          </h1>
          <p className="text-lg mb-10 max-w-2xl mx-auto">
            Your comprehensive cloud management platform. Deploy, monitor, and scale your applications with ease.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="border border-black px-6 py-2 hover:bg-black hover:text-white transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="border border-gray-400 px-6 py-2 hover:bg-gray-100 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-gray-300 p-6">
            <h3 className="text-lg font-semibold mb-2">Fast Deployment</h3>
            <p className="text-sm">Deploy your applications in seconds with our streamlined deployment pipeline.</p>
          </div>

          <div className="border border-gray-300 p-6">
            <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
            <p className="text-sm">Monitor your infrastructure and applications with real-time metrics and alerts.</p>
          </div>

          <div className="border border-gray-300 p-6">
            <h3 className="text-lg font-semibold mb-2">Auto Scaling</h3>
            <p className="text-sm">Automatically scale your resources based on demand and performance metrics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
