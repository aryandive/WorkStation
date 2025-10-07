// This is a simple event bus for cross-component communication.
// It allows one component to dispatch an event, and another to listen for it,
// without them needing to be directly connected via props.
const eventBus = {
    on(event, callback) {
        document.addEventListener(event, (e) => callback(e.detail));
    },
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event, callback) {
        document.removeEventListener(event, callback);
    },
};

export default eventBus;

