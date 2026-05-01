import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="w-full h-screen flex">
      
      <div className="relative flex-1 hidden lg:flex items-center justify-center bg-gray-900">
        <div className="relative z-10 w-full max-w-md">
          <img src="/logo.svg" width={100} alt="AI Mock Interview" />

          <div className="mt-16 space-y-3">
            <h3 className="text-white text-3xl font-bold">
              Get Interview-Ready with AI
            </h3>

            <p className="text-gray-300">
              Sign up to create role-based mock interviews, answer using voice or
              video, and receive instant AI-powered feedback to boost your
              confidence and performance.
            </p>
          </div>
        </div>

        <div
          className="absolute inset-0 my-auto h-[500px]"
          style={{
            background:
              "linear-gradient(152.92deg, rgba(99, 102, 241, 0.25) 4.54%, rgba(139, 92, 246, 0.3) 34.2%, rgba(99, 102, 241, 0.15) 77.55%)",
            filter: "blur(118px)",
          }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <SignUp forceRedirectUrl="/dashboard" />
      </div>

    </main>
  );
}
