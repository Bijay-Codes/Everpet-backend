export default function validRegisterPayload(overrides = {}) {
    return {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Abc12345!',
        ...overrides,
    };
}

// export function checkValidUserinfoReturned() {
//     const format = 
// }