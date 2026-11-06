(function registerCcxpLiteNthuModsUrl(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};

  function buildNthuModsUrl(
    locale: string,
    semester: string,
    courseIds: readonly string[],
  ): string | undefined {
    const normalizedSemester = semester.trim().replaceAll(",", "");
    if (normalizedSemester === "" || courseIds.length === 0) {
      return undefined;
    }
    const language = locale.toLowerCase().startsWith("zh") ? "zh" : "en";
    const encodedIds = courseIds
      .slice(0, 60)
      .map((courseId) => encodeURIComponent(courseId.trim()))
      .join(",");
    return `https://nthumods.com/${language}/timetable/view?semester_${normalizedSemester}=${encodedIds}&source=ccxp`;
  }

  namespace.nthuModsUrl = { buildNthuModsUrl };
})(globalThis);
