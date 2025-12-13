export const validateUser = (data: any, isUpdate: boolean = false) => {
  const errors: string[] = [];

  // Name validation
  if (!isUpdate || (isUpdate && data.name !== undefined)) {
    if (!data.name) {
      errors.push('Name is required.');
    } else if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name must be a non-empty string.');
    }
  }

  // Email validation
  if (!isUpdate || (isUpdate && data.email !== undefined)) {
    if (!data.email) {
      errors.push('Email is required.');
    } else if (typeof data.email !== 'string' || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.push('Email is invalid.');
    }
  }

  // Password validation
  if (!isUpdate || (isUpdate && data.password !== undefined)) {
    if (!data.password) {
      errors.push('Password is required.');
    } else if (typeof data.password !== 'string' || data.password.length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }
  }

  // Role validation
  if (!isUpdate || (isUpdate && data.role !== undefined)) {
    if (!data.role) {
      errors.push('Role is required.');
    } else if (typeof data.role !== 'string' || !['seeker', 'provider'].includes(data.role)) {
      errors.push('Invalid role. Must be "seeker" or "provider".');
    }
  }

  // Phone validation
  if (!isUpdate || (isUpdate && data.phone !== undefined)) {
    if (!data.phone) {
      errors.push('Phone number is required.');
    } else if (typeof data.phone !== 'string' || data.phone.trim().length === 0) {
      errors.push('Phone number must be a non-empty string.');
    }
  }

  // Provider-specific fields validation
  // If creating, use data.role. If updating, assume it's a provider if these fields are present.
  const effectiveRole = data.role || (isUpdate && (data.provider_type !== undefined || data.id_number !== undefined || data.address !== undefined) ? 'provider' : null);

  if (effectiveRole === 'provider') {
    // provider_type
    if (!isUpdate || (isUpdate && data.provider_type !== undefined)) {
      if (!data.provider_type) {
        errors.push('Provider type is required for providers.');
      } else if (typeof data.provider_type !== 'string' || data.provider_type.trim().length === 0) {
        errors.push('Provider type must be a non-empty string.');
      }
    }

    // id_number
    if (!isUpdate || (isUpdate && data.id_number !== undefined)) {
      if (!data.id_number) {
        errors.push('ID number is required for providers.');
      } else if (typeof data.id_number !== 'string' || data.id_number.trim().length === 0) {
        errors.push('ID number must be a non-empty string.');
      }
    }

    // address
    if (!isUpdate || (isUpdate && data.address !== undefined)) {
      if (!data.address) {
        errors.push('Address is required for providers.');
      } else if (typeof data.address !== 'string' || data.address.trim().length === 0) {
        errors.push('Address must be a non-empty string.');
      }
    }
  }

  return errors;
};

export const validateService = (data: any, isUpdate: boolean = false) => {
  const errors: string[] = [];

  if (!isUpdate && (data.provider_id === undefined || data.provider_id === null)) {
    errors.push('Provider ID is required.');
  }
  if (!isUpdate && !data.title) {
    errors.push('Title is required.');
  }
  if (!isUpdate && !data.description) {
    errors.push('Description is required.');
  }
  if (!isUpdate && !data.category) {
    errors.push('Category is required.');
  }
  if (!isUpdate && (data.price === undefined || data.price === null)) {
    errors.push('Price is required.');
  } else if (data.price !== undefined && data.price !== null && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push('Price must be a non-negative number.');
  }

  return errors;
};

export const validateRequest = (data: any, isUpdate: boolean = false) => {
  const errors: string[] = [];

  if (!isUpdate && (data.client_id === undefined || data.client_id === null)) {
    errors.push('Client ID is required.');
  }
  if (!isUpdate && !data.title) {
    errors.push('Title is required.');
  }
  if (!isUpdate && !data.description) {
    errors.push('Description is required.');
  }
  if (data.status && !['pending', 'accepted', 'completed', 'cancelled', 'payment_pending'].includes(data.status)) { // Added 'payment_pending'
    errors.push('Invalid request status. Must be "pending", "accepted", "completed", "cancelled", or "payment_pending".');
  }

  // New payment fields validation
  if (data.payment_status && !['unpaid', 'pending_review', 'paid', 'rejected'].includes(data.payment_status)) {
    errors.push('Invalid payment status. Must be "unpaid", "pending_review", "paid", or "rejected".');
  }
  if (data.payment_reference !== undefined && typeof data.payment_reference !== 'string') {
    errors.push('Payment reference must be a string.');
  }
  if (data.receipt_url !== undefined && typeof data.receipt_url !== 'string') {
    errors.push('Receipt URL must be a string.');
  }

  return errors;
};

export const validateRating = (data: any, isUpdate: boolean = false) => {
  const errors: string[] = [];

  if (!isUpdate && (data.service_id === undefined || data.service_id === null)) {
    errors.push('Service ID is required.');
  }
  if (!isUpdate && (data.client_id === undefined || data.client_id === null)) {
    errors.push('Client ID is required.');
  }
  if (!isUpdate && (data.rating === undefined || data.rating === null)) {
    errors.push('Rating is required.');
  } else if (data.rating !== undefined && data.rating !== null && (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5)) {
    errors.push('Rating must be a number between 1 and 5.');
  }

  return errors;
};

export const validateMessage = (data: any, isUpdate: boolean = false) => {
  const errors: string[] = [];

  if (!isUpdate && (data.sender_id === undefined || data.sender_id === null)) {
    errors.push('Sender ID is required.');
  }
  if (!isUpdate && (data.receiver_id === undefined || data.receiver_id === null)) {
    errors.push('Receiver ID is required.');
  }
  if (!isUpdate && !data.conversation_id) {
    errors.push('Conversation ID is required.');
  }
  if (!isUpdate && !data.text) {
    errors.push('Message text is required.');
  }

  return errors;
};