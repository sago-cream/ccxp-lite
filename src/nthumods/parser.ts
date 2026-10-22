(function registerCcxpLiteNthuModsParser(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const COURSE_ID_PATTERN = /^\d{5}[A-Za-z0-9]{1,4}\s*\d{6}$/u;
  const COURSE_SEMESTER_PATTERN = /^\d{5}/u;
  const COURSE_LIMIT = 60;
  const COURSE_NUMBER_HEADER = "\u79D1\u865F";
  const REGISTERED_COURSES_HEADER = "\u5DF2\u9078\u4E0A";
  const REASON_HEADER = "\u539F\u56E0";

  function hasReasonHeader(table: HTMLTableElement): boolean {
    return [...table.rows].some((row) => {
      const rowText = row.textContent.replaceAll(/\s+/gu, " ").trim();
      const isCourseHeader =
        rowText.includes(COURSE_NUMBER_HEADER) || rowText.includes("Course Number");
      return (
        isCourseHeader &&
        [...row.cells].some((cell) => {
          const cellText = cell.textContent.replaceAll(/\s+/gu, " ").trim();
          return cellText.includes(REASON_HEADER) || cellText.includes("Reason");
        })
      );
    });
  }

  function hasCourseRows(table: HTMLTableElement): boolean {
    return [...table.querySelectorAll<HTMLTableRowElement>("tr.class3")].some((row) => {
      const firstCell = row.querySelector<HTMLTableCellElement>(":scope > td, :scope > th");
      const candidate = firstCell?.textContent.trim() ?? "";
      return COURSE_ID_PATTERN.test(candidate);
    });
  }

  function findRegisteredCoursesTable(targetDocument: Document): HTMLTableElement | undefined {
    const tables = [...targetDocument.querySelectorAll<HTMLTableElement>("table")];
    const registeredTable = tables.find((table) => {
      const text = table.textContent.replaceAll(/\s+/gu, " ").trim();
      return (
        text.includes(REGISTERED_COURSES_HEADER) || text.includes("registered for successfully")
      );
    });
    if (registeredTable !== undefined) {
      return registeredTable;
    }

    return tables.find((table) => !hasReasonHeader(table) && hasCourseRows(table));
  }

  function readSubmittedSemester(targetDocument: Document): string {
    const year = targetDocument
      .querySelector<HTMLInputElement>(
        "form input[type='hidden'][name='year'], input[type='hidden'][name='year']",
      )
      ?.value.trim();
    const term = targetDocument
      .querySelector<HTMLInputElement>(
        "form input[type='hidden'][name='term'], input[type='hidden'][name='term']",
      )
      ?.value.trim();
    if (year !== undefined && year !== "" && term !== undefined && term !== "") {
      return `${year}${term}`.replaceAll(",", "");
    }
    return "";
  }

  function parseCourseResult(targetDocument: Document): CcxpLiteNthuModsCourseResult {
    const resultTable = findRegisteredCoursesTable(targetDocument);
    const courseIds: string[] = [];
    const seen = new Set<string>();

    if (resultTable !== undefined) {
      for (const row of resultTable.querySelectorAll<HTMLTableRowElement>("tr.class3")) {
        const firstCell = row.querySelector<HTMLTableCellElement>(":scope > td, :scope > th");
        const candidate = firstCell?.textContent.trim() ?? "";
        if (!COURSE_ID_PATTERN.test(candidate) || seen.has(candidate)) {
          continue;
        }
        seen.add(candidate);
        if (courseIds.length < COURSE_LIMIT) {
          courseIds.push(candidate);
        }
      }
    }

    const submittedSemester = readSubmittedSemester(targetDocument);
    if (submittedSemester !== "") {
      return { semester: submittedSemester, courseIds };
    }

    const semesterCounts = new Map<string, number>();
    let commonSemester = "";
    let commonCount = 0;
    for (const courseId of courseIds) {
      const semester = COURSE_SEMESTER_PATTERN.exec(courseId)?.[0];
      if (semester === undefined) {
        continue;
      }
      const count = (semesterCounts.get(semester) ?? 0) + 1;
      semesterCounts.set(semester, count);
      if (count > commonCount) {
        commonSemester = semester;
        commonCount = count;
      }
    }

    return {
      semester: commonSemester,
      courseIds: courseIds.filter((courseId) => courseId.startsWith(commonSemester)),
    };
  }

  namespace.nthuModsParser = { findRegisteredCoursesTable, parseCourseResult };
})(globalThis);
