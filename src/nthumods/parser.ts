(function registerCcxpLiteNthuModsParser(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const COURSE_ID_PATTERN = /^\d{5}[A-Za-z0-9]{1,4}\s*\d{6}$/u;
  const COURSE_SEMESTER_PATTERN = /^\d{5}/u;
  const COURSE_LIMIT = 60;

  function readSubmittedSemester(
    targetDocument: Document,
    resultTable: HTMLTableElement | null,
  ): string {
    const resultForm = resultTable?.closest("form") as HTMLFormElement | null;
    const submittedValue = resultForm ? new FormData(resultForm).get("semester") : undefined;
    const fallbackControl = targetDocument.querySelector<HTMLSelectElement | HTMLInputElement>(
      "select[name='semester'], input[name='semester']",
    );
    const rawValue =
      typeof submittedValue === "string" && submittedValue !== ""
        ? submittedValue
        : fallbackControl?.value;
    return (rawValue ?? "").trim().replaceAll(",", "");
  }

  function parseCourseResult(targetDocument: Document): CcxpLiteNthuModsCourseResult {
    const resultTable = targetDocument
      .querySelectorAll<HTMLTableElement>("table")
      .item(1) as HTMLTableElement | null;
    const courseIds: string[] = [];
    const seen = new Set<string>();

    for (const row of resultTable?.querySelectorAll<HTMLTableRowElement>("tbody > .class3") ?? []) {
      const candidate = row.children.length === 0 ? "" : row.children[0].textContent.trim();
      if (!COURSE_ID_PATTERN.test(candidate) || seen.has(candidate)) {
        continue;
      }
      seen.add(candidate);
      if (courseIds.length < COURSE_LIMIT) {
        courseIds.push(candidate);
      }
    }

    const submittedSemester = readSubmittedSemester(targetDocument, resultTable);
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

  namespace.nthuModsParser = { parseCourseResult };
})(globalThis);
