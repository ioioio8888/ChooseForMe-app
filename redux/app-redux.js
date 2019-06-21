import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import * as firebase from "firebase";

//Initial State

const InitialState = {
    loggingIn: false,
    publicPolls: [],
    publicPollsRef: [],
    refreshingPublicPolls: false,
};

//Reducer

const reducer = (state = InitialState, action) => {
    switch (action.type) {
        case "setLoggingIn":
            return { ...state, loggingIn: action.value };
        case "setPublicPolls":
            return { ...state, publicPolls: action.value };
        case "setPublicPollsRef":
            return { ...state, publicPollsRef: action.value };
        case "setRefreshingPublicPolls":
            return { ...state, refreshingPublicPolls: action.value };
        default: return state;
    }

    return state;
};

//Store
const store = createStore(reducer, applyMiddleware(thunkMiddleware));
export { store };


//action creator
const setLoggingIn = (logging) => {
    return {
        type: "setLoggingIn",
        value: logging,
    }
}

const setPublicPolls = (publicPolls) => {
    return {
        type: "setPublicPolls",
        value: publicPolls,
    }
}

const setPublicPollsRef = (publicPollsRef) => {
    return {
        type: "setPublicPollsRef",
        value: publicPollsRef,
    }
}

const setRefreshingPublicPolls = (refreshing) => {
    return {
        type: "setRefreshingPublicPolls",
        value: refreshing,
    }
}

const watchPublicPolls = () => {
    return (dispatch, getState) => {
        //console.log(getState().publicPollsRef[0]);
        getState().publicPollsRef.forEach((ref) => {
            ref.onSnapshot((doc) => {
                var db = firebase.firestore();
                var data = doc.data();
                data.id = doc.id;
                data.authorName = "unknown";
                var docRef = db.collection("users").doc(doc.data().author);
                docRef.get().then((userdoc) => {
                    if (userdoc.exists) {
                        data.authorName = userdoc.data().displayName;
                        data.photoURL = userdoc.data().photoURL;
                        //add or replace
                        var pollsdata = getState().publicPolls;
                        const i = pollsdata.findIndex(_item => _item.id === data.id);
                        if (i > -1) pollsdata[i] = data; 
                        else pollsdata.push(data);
                        dispatch(setPublicPolls(pollsdata));

                        console.log(getState().publicPolls);
                    }
                }
                ).catch((error) => {
                    console.log(error);
                });
            });
        })
    }
}

const getPublicPollsList = () => {
    return function (dispatch) {
        dispatch(setRefreshingPublicPolls(true));
        var db = firebase.firestore();
        var Refs = [];
        db.collection("polls").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                Refs.push(doc.ref);
            })
            dispatch(setPublicPollsRef(Refs));
            dispatch(watchPublicPolls());
            dispatch(setRefreshingPublicPolls(false));
        }).catch((error) => {
            console.log(error);
        });
    }
}

export { setLoggingIn, setPublicPolls, getPublicPollsList };