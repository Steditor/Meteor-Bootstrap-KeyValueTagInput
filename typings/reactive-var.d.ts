// add internal property dep for enforced dependency changes

declare module "meteor/reactive-var" {
    interface ReactiveVar<T> {
        dep: Tracker.Dependency;
    }
}
