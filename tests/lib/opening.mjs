export async function answerOpening(page, parent) {
  const choices = page.locator(parent + ' .nm-opening-choice');
  if (await choices.count()) await choices.first().click();
}
