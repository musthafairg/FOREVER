export const getDateRange = (filter, from, to) => {
  const start = new Date();
  const end = new Date();
  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "custom":
      return {
        start: new Date(from),
        end: new Date(to),
      };
  }

  return {
    start,
    end,
  };
};
