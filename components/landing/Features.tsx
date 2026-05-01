export default function Features() {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-screen-xl px-4 py-24">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Key Features
        </h2>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="AI-Generated Questions"
            description="Interview questions dynamically generated using Google Gemini based on your job role."
          />

          <Feature
            title="Video & Voice Recording"
            description="Answer questions using webcam and speech-to-text for a realistic interview setup."
          />

          <Feature
            title="AI Feedback & Ratings"
            description="Each answer is evaluated by AI with structured feedback and a performance score."
          />

          <Feature
            title="Interview Dashboard"
            description="View all your mock interviews, answers, and feedback in one place."
          />

          <Feature
            title="Secure Authentication"
            description="Clerk-based authentication ensures all interviews are private and user-specific."
          />

          <Feature
            title="Persistent Data Storage"
            description="All interviews and feedback are securely stored in PostgreSQL using Drizzle ORM."
          />
        </div>
      </div>
    </section>
  )
}

function Feature({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  )
}
