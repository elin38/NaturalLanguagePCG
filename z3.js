// import './style.css';
// import { init } from 'z3-solver';

// const { Context } = await init();
// const { Solver, Int, And, Or, Not, Distinct } = new Context("main");
// let solver = new Solver();

// // Function to add text to the #app div
// function appendToApp(text) {
//     const p = document.createElement('p');
//     p.textContent = text;
//     document.querySelector('#app').appendChild(p);
// }

// // Function to format arrays nicely with bullet points
// function appendArrayToApp(arrayTitle, array) {
//     const container = document.createElement('div');
//     const title = document.createElement('p');
//     title.textContent = arrayTitle;
//     container.appendChild(title);

//     const list = document.createElement('ul');
//     array.forEach((item) => {
//         const listItem = document.createElement('span');
//         listItem.textContent = `(x: ${item.x}, y: ${item.y}) `;
//         list.appendChild(listItem);
//     });
//     container.appendChild(list);

//     document.querySelector('#app').appendChild(container);
// }

// async function findAllSolutions(solver, constraint, array) {
//     solver.add(constraint);
//     while ((await solver.check()).toString() === 'sat') {
//         const model = solver.model();
//         const xVal = model.eval(x).value();
//         const yVal = model.eval(y).value();
//         array.push({ x: Number(xVal), y: Number(yVal) });

//         solver.add(Or(x.neq(xVal), y.neq(yVal)));
//     }
//     solver.reset();
// }

// // Inside Fence
// const x = Int.const('x');
// const y = Int.const('y');
// const insideFenceArray = [];
// await findAllSolutions(
//     new Solver(),
//     And(x.gt(21), x.lt(29), y.gt(17), y.lt(20)),
//     insideFenceArray
// );
// console.log("Inside the fence:", insideFenceArray);
// appendArrayToApp("Inside the fence:", insideFenceArray);

// // On the Fence
// const onFenceArray = [];
// await findAllSolutions(
//     new Solver(),
//     Or(
//         And(x.eq(21), y.ge(17), y.le(20)),
//         And(x.eq(29), y.ge(17), y.le(20)),
//         And(y.eq(17), x.ge(21), x.le(29)),
//         And(y.eq(20), x.ge(21), x.le(29))
//     ),
//     onFenceArray
// );
// console.log("On the fence:", onFenceArray);
// appendArrayToApp("On the fence:", onFenceArray);

// // Outside the Fence
// const outFenceArray = [];
// await findAllSolutions(
//     new Solver(),
//     And(
//       Or(x.lt(21), x.gt(29)),
//       Or(y.lt(17), y.gt(20)),
//       x.ge(0), x.lt(39),
//       y.ge(0), y.lt(24)
//     ),
//     outFenceArray
// );
// console.log("Outside the fence:", outFenceArray);
// appendArrayToApp("Outside the fence:", outFenceArray);

// export function getRandomCoordinateInsideFench() {
//     return insideFenceArray[Math.random() * insideFenceArray.length];
// }

// // document.querySelector('#app').innerHTML += `
// //   <div>
// //     <p>Check the console for more details.</p>
// //   </div>
// // `;
