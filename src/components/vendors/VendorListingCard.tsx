'use client';

import Link from 'next/link';
import { Vendor } from '@/types';
import VendorCardImage from '@/components/vendors/VendorCardImage';

interface Props {
  vendor: Vendor;
}

/**
 * Standalone vendor card for grids — extracted from VendorsListClient so the
 * hyperlocal landing pages (/vendors/category/[c], /vendors/in/[r],
 * /vendors/in/[r]/[c]) can render the same look without duplicating the
 * markup. Watercolor placeholder + name + city + description + 3 specialties
 * + Call/Email + optional Website link.
 */
export default function VendorListingCard({ vendor }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative w-full h-48">
        <VendorCardImage vendor={vendor} />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{vendor.name}</h3>
            <p className="text-pink-600 font-medium capitalize">{vendor.category}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600 text-sm">📍 {vendor.address.city}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{vendor.description}</p>

        {vendor.specialties && vendor.specialties.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {vendor.specialties.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {vendor.contact.phone ? (
            <a
              href={`tel:${vendor.contact.phone}`}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
            >
              Call Now
            </a>
          ) : (
            <Link
              href={`/vendors/${vendor.slug || vendor.id}`}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition"
            >
              View Details
            </Link>
          )}
          {vendor.contact.email ? (
            <a
              href={`mailto:${vendor.contact.email}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium text-center transition"
            >
              Email
            </a>
          ) : (
            <Link
              href={`/vendors/${vendor.slug || vendor.id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium text-center transition"
            >
              Profile
            </Link>
          )}
        </div>

        {vendor.contact.website && (
          <div className="mt-3">
            <a
              href={vendor.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-700 text-sm font-medium"
            >
              Visit Website →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
