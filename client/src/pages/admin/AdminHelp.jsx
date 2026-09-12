import {
  LayoutDashboard,
  ClipboardList,
  Mail,
  Car,
  Tag,
  UserCog,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

const SECTIONS = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    body: "Shows live counts pulled straight from the database — total, pending and completed bookings, enquiries, active services and vehicles. Every number here reflects real data; nothing is estimated.",
  },
  {
    icon: ClipboardList,
    title: "Bookings",
    body: "View every trip booking, whether it was created directly or converted from a customer enquiry. Open a booking to update its status (Pending → Confirmed → Completed, or Cancelled) and see the full history of changes.",
  },
  {
    icon: Mail,
    title: "Enquiries",
    body: 'Every message from the website lands here — both Contact Us messages and Book Now requests, tagged with a Source badge so you can tell them apart. For a booking request, open it and click "Convert to Booking" to create a real booking without retyping anything.',
  },
  {
    icon: Car,
    title: "Vehicles",
    body: "Add or edit vehicles here: name, description, seating and luggage capacity, features, and pricing. Upload images directly — they're stored in Cloudinary and appear automatically on the public Vehicles and Vehicle Detail pages the moment you save.",
  },
  {
    icon: Tag,
    title: "Pricing",
    body: 'Set detailed per-trip-type rates (Local, Outstation, Airport, Package) for a specific vehicle. These appear as a "Tariff Details" table on that vehicle\'s public detail page automatically.',
  },
  {
    icon: UserCog,
    title: "Drivers",
    body: "Manage your driver roster — name, license, experience, vehicle assignment, and active/inactive status. Driver details are internal only and are never shown on the public website.",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    body: "Add, edit, reorder, or publish/unpublish frequently asked questions. Only Published FAQs appear on the public FAQ page — draft one here and it stays hidden until you're ready.",
  },
];

export default function AdminHelp() {
  return (
    <div className="max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Admin Panel Help
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          A quick guide to what each section does and how it connects to the
          public website.
        </p>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 text-sm text-blue-900 shadow-sm">
        <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
        <p>
          <strong>General workflow:</strong> Website → Booking or enquiry
          submitted → Database → shows up here in Admin. And in the other
          direction: Admin change (vehicle, price, FAQ) → Database → shows up
          automatically on the website. You never need to edit two places for
          the same thing.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex gap-4"
          >
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-red-600">
              <Icon size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
