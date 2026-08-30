const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with an error status
    return error.response.data?.message || "Something went wrong. Please try again.";
  }

  if (error.request) {
    // Request made but no response received
    return "Unable to reach the server. Please check your connection.";
  }

  return "Something unexpected happened. Please try again.";
};

export default getErrorMessage;