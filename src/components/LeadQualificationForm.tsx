'use client';

import React, { useState } from 'react';

export interface LeadQualificationData {
  fullName: string;
  email: string;
  phoneNumber: string;
  eventType: string;
  guestCount: number;
  preferredDate: string;
  dateFlexibility: string;
  venuebudget: string;
}

interface LeadQualificationFormProps {
  initialData?: Partial<LeadQualificationData>;
  onSubmit: (data: LeadQualificationData) => void;
  onCancel?: () => void;
  onSkip?: () => void;
  submitButtonText?: string;
  title?: string;
  description?: string;
  showSkipOption?: boolean;
}

const LeadQualificationForm: React.FC<LeadQualificationFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  onSkip,
  submitButtonText = "Save Profile",
  title = "Complete Your Wedding Profile",
  description = "Help us match you with perfect venues by sharing a few details about your special day.",
  showSkipOption = false
}) => {
  const [formData, setFormData] = useState<LeadQualificationData>({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phoneNumber: initialData.phoneNumber || '',
    eventType: initialData.eventType || 'Wedding',
    guestCount: initialData.guestCount || 0,
    preferredDate: initialData.preferredDate || '',
    dateFlexibility: initialData.dateFlexibility || '',
    venuebudget: initialData.venuebudget || ''
  });

  const [errors, setErrors] = useState<Partial<LeadQualificationData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<LeadQualificationData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Please select an event type';
    }

    if (!formData.guestCount || formData.guestCount < 1) {
      newErrors.guestCount = 'Please enter the number of guests';
    }

    if (!formData.dateFlexibility) {
      newErrors.dateFlexibility = 'Please indicate your date flexibility';
    }

    if (!formData.venuebudget) {
      newErrors.venuebudget = 'Please select your venue budget range';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof LeadQualificationData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information Section */}
        <div className="bg-pink-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-pink-800 mb-4 flex items-center">
            <span className="mr-2">👤</span>
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Your full name"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>
        </div>

        {/* Event Details Section */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
            <span className="mr-2">💒</span>
            Event Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select
                id="eventType"
                value={formData.eventType}
                onChange={(e) => handleInputChange('eventType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.eventType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select event type</option>
                <option value="Wedding">Wedding</option>
                <option value="Engagement Party">Engagement Party</option>
                <option value="Rehearsal Dinner">Rehearsal Dinner</option>
                <option value="Reception Only">Reception Only</option>
                <option value="Vow Renewal">Vow Renewal</option>
                <option value="Other">Other</option>
              </select>
              {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType}</p>}
            </div>

            <div>
              <label htmlFor="guestCount" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Guest Count *
              </label>
              <input
                type="number"
                id="guestCount"
                min="1"
                max="1000"
                value={formData.guestCount || ''}
                onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.guestCount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="150"
              />
              {errors.guestCount && <p className="text-red-500 text-sm mt-1">{errors.guestCount}</p>}
            </div>

            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Event Date
              </label>
              <input
                type="date"
                id="preferredDate"
                value={formData.preferredDate}
                onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="dateFlexibility" className="block text-sm font-medium text-gray-700 mb-1">
                Date Flexibility *
              </label>
              <select
                id="dateFlexibility"
                value={formData.dateFlexibility}
                onChange={(e) => handleInputChange('dateFlexibility', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.dateFlexibility ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select flexibility</option>
                <option value="This date is firm">This date is firm</option>
                <option value="Flexible +/- one week">Flexible +/- one week</option>
                <option value="Flexible +/- one month">Flexible +/- one month</option>
                <option value="I have not set a date yet">I have not set a date yet</option>
                <option value="Flexible with season">Flexible with season (Spring/Summer/Fall/Winter)</option>
              </select>
              {errors.dateFlexibility && <p className="text-red-500 text-sm mt-1">{errors.dateFlexibility}</p>}
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
            <span className="mr-2">💰</span>
            Venue Budget
          </h3>
          
          <div>
            <label htmlFor="venuebudget" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Budget for Venue *
            </label>
            <select
              id="venuebudget"
              value={formData.venuebudget}
              onChange={(e) => handleInputChange('venuebudget', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.venuebudget ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select budget range</option>
              <option value="Under $3,000">Under $3,000</option>
              <option value="$3,000 - $5,000">$3,000 - $5,000</option>
              <option value="$5,001 - $10,000">$5,001 - $10,000</option>
              <option value="$10,001 - $15,000">$10,001 - $15,000</option>
              <option value="$15,001 - $25,000">$15,001 - $25,000</option>
              <option value="$25,001 - $40,000">$25,001 - $40,000</option>
              <option value="$40,001 - $60,000">$40,001 - $60,000</option>
              <option value="Over $60,000">Over $60,000</option>
            </select>
            {errors.venuebudget && <p className="text-red-500 text-sm mt-1">{errors.venuebudget}</p>}
            <p className="text-sm text-gray-500 mt-1">
              This helps us match you with venues in your price range
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
            >
              Cancel
            </button>
          )}
          
          {showSkipOption && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
              Skip for Now
            </button>
          )}
          
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-md hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all transform hover:scale-105"
          >
            {submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadQualificationForm;
