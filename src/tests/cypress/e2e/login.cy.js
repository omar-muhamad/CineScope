describe("Login page", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/login");
  });

  it("has a heading login", () => {
    const heading = cy.get('[data-test-id="login-heading"]');

    heading.should("exist").should("have.text", "Login");
  });

  it("has a login button", () => {
    const button = cy.get('[data-test-id="login-button"]');

    button.should("exist").should("have.text", "Login");
  });

  it("successfully logs in", async () => {
    const button = cy.get('[data-test-id="login-button"]');

    await button.click();

    cy.url().should("eq", "http://localhost:5173/");
  });
});
