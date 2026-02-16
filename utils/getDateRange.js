export const getDateRange = (filter = "today", from, to) => {
  const now = new Date();
  let start, end;

  switch (filter) {

    case "today":
      start = new Date();
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;

    case "week":
      start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;

    case "month":
      start = new Date();
      start.setDate(start.getDate() - 29); 
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;

    case "year":
      start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;

    case "custom":
      if (!from || !to) {
        throw new Error("From and To dates required for custom filter");
      }

      start = new Date(from);
      end = new Date(to);

      if (isNaN(start) || isNaN(end)) {
        throw new Error("Invalid date format");
      }

      if (start > end) {
        throw new Error("From date cannot be greater than To date");
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    default:
      start = new Date();
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};
