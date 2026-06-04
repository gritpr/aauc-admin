import { EventForm } from "@/components/admin/EventForm";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New event</h1>
      <p className="mt-1 text-gray-500">Create a draft event</p>
      <div className="mt-8">
        <EventForm />
      </div>
    </div>
  );
}
