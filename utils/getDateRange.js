export const getDateRange = (filter = "today", from, to) => {
  const now = new Date();
  let start, end;

  switch (filter) {
    case "today": {
      start = new Date();
      start.setHours(0, 0, 0, 0);

      end = new Date();
      break;
    }

    case "week": {
      start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      end = new Date();
      break;
    }

    case "month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);

      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    }

    case "year": {
      start = new Date(now.getFullYear() - 1, 0, 1);
      start.setHours(0, 0, 0, 0);

      end = new Date(now.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }

    case "custom": {
      if (!from || !to) {
        throw new Error("From and To dates required for custom filter");
      }

      start = new Date(from);
      start.setHours(0, 0, 0, 0);

      end = new Date(to);
      end.setHours(23, 59, 59, 999);
      break;
    }

    default: {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
    }
  }

  return { start, end };
};
