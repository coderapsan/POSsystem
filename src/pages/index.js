import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/common/Navbar";

export default function Home() {
  return (
    <>
      <Head>
        <title>The MoMos POS</title>
        <meta name="description" content="Simple point-of-sale portal for The MoMos." />
      </Head>
      <Navbar />
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <section className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-orange-700 mb-2">Welcome to The MoMos POS</h1>
          <p className="text-gray-600">
            Use the links below to access the in-store ordering screen, review past
            orders, or manage menu and settings from the admin panel.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/order" className="block bg-orange-600 text-white rounded-lg p-5 shadow hover:bg-orange-700 transition">
            <h2 className="text-xl font-semibold">POS Order Screen</h2>
            <p className="text-sm mt-2">Take in-store and phone orders.</p>
          </Link>
          <Link href="/order-history" className="block bg-orange-500 text-white rounded-lg p-5 shadow hover:bg-orange-600 transition">
            <h2 className="text-xl font-semibold">Order History</h2>
            <p className="text-sm mt-2">Search and reprint previous orders.</p>
          </Link>
          <Link href="/admin" className="block bg-gray-800 text-white rounded-lg p-5 shadow hover:bg-gray-900 transition">
            <h2 className="text-xl font-semibold">Admin Panel</h2>
            <p className="text-sm mt-2">Manage menu, exports, and settings.</p>
          </Link>
        </section>
      </main>
    </>
  );
}
