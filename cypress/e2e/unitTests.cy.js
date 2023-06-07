describe ('View inital page', () => {
    it('should be able to open the page', () => {
        cy.visit('http://localhost:4000/');
        cy.wait(2000);
    });
});

describe ('View sign in form', () => {
    it('should be able to open a sign in form', () => {
        cy.visit('http://localhost:4000/');
        cy.get('button').contains('Sign In').click({force: true});
        cy.wait(2000);
    });
});

describe('Sign in with no password', () => {
    it('should not be able to sign in with no password', () => {
        cy.visit('http://localhost:4000/');
        cy.get('button').contains('Sign In').click({force: true});
        cy.wait(2000);
        cy.get('#signInEmail').type('admin')
        cy.get('#signInModal > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
        cy.wait(2000);
    });
});

describe('Sign in with no email', () => {
    it('should not be able to sign in with no email', () => {
        cy.visit('http://localhost:4000/');
        cy.get('button').contains('Sign In').click({force: true});
        cy.wait(2000);
        cy.get('#signInPassword').type('KartulKartul')
        cy.get('#signInModal > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
        cy.wait(2000);
    });
});

describe('Sign in with wrong password', () => {
    it('should not be able to sign in with wrong password', () => {
        cy.visit('http://localhost:4000/');
        cy.get('button').contains('Sign In').click({force: true});
        cy.wait(2000);
        cy.get('#signInEmail').type('adminnnnn')
        cy.get('#signInPassword').type('KartulKartul')
        cy.get('#signInModal > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
        cy.wait(2000);
    });
});

describe('Add a shoe', () => {
    it('should be able to add a shoe', () => {
        cy.visit('http://localhost:4000/');
        cy.get('button').contains('Sign In').click({force: true});
        cy.wait(2000);
        cy.get('#signInEmail').type('admin')
        cy.get('#signInPassword').type('KartulKartul')
        cy.get('#signInModal > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click({force: true});
        cy.wait(2000);
        cy.get('button').contains('Add Shoe').click({force: true});
        cy.wait(2000);
        cy.get('#addShoeTitle').type('Shoe 4', {force: true})
        cy.get('#addShoeBrand').type('Nike', {force: true})
        cy.get('#addShoeSizes').type('40', {force: true})
        cy.get('#addShoeContent').type('This is an example of a shoe', {force: true})
        cy.get('#addShoeModal > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click({force: true});
        cy.wait(2000);
    });
});