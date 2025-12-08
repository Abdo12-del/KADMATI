// This file will contain validation logic for incoming request data.
// For now, it's empty, but we'll add functions here as needed.

export const validateUser = (data: any, isUpdate: boolean = false) => {
  const errors: string[] = [];

  if (!isUpdate && !data.name) {
    errors.push('Name is required.');
  }
  if (!isUpdate && !data.email) {
    errors.push('Email is required.');
  } else if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Email is invalid.');
  }
  if (!isUpdate && !data.password) {
    errors.push('Password is required.');
  } else if (data.password && data.password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }
  if (!isUpdate && !data.role) {
    errors.push('Role is required.');
  } else if (data.role && !['seeker', 'provider'].includes(data.role)) {
    errors.push('Invalid role. Must be "seeker" or "provider".');
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
  if (data.status && !['pending', 'accepted', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('Invalid request status. Must be "pending", "accepted", "completed", or "cancelled".');
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