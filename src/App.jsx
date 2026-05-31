import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function App() {
  const [rpm, setRpm] = useState(3000);
  const [viscosity, setViscosity] = useState(0.05);
  const [evaporation, setEvaporation] = useState(0.1);
  const [initialThickness, setInitialThickness] = useState(100);
  const [waferRadius, setWaferRadius] = useState(50);

  const [finalThickness, setFinalThickness] = useState(null);
  const [uniformity, setUniformity] = useState(null);
  const [reynolds, setReynolds] = useState(null);
  const [capillary, setCapillary] = useState(null);
  const [regime, setRegime] = useState("");
  const [graphData, setGraphData] = useState([]);
  const [radiusData, setRadiusData] = useState([]);

  function runSimulation() {
    const rho = 1000;
    const sigma = 0.03;

    const omega = (2 * Math.PI * rpm) / 60;

    let h = initialThickness * 1e-6;

    const dt = 0.02;
    const totalTime = 10;

    let results = [];

    for (let t = 0; t <= totalTime; t += dt) {
      const dhdt =
        -((2 * rho * omega * omega) /
          (3 * viscosity)) *
          Math.pow(h, 3) -
        evaporation * 1e-7;

      h += dhdt * dt;

      if (h < 0) {
        h = 0;
      }

      results.push({
        time: Number(t.toFixed(2)),
        thickness: Number((h * 1e6).toFixed(3)),
      });
    }

    const finalH = h * 1e6;
    let radialProfile = [];

    for (let r = 0; r <= waferRadius; r += waferRadius / 20) {
      const normalizedR = r / waferRadius;

       const baseThickness =
         finalH *
         (1 - 0.3 * Math.pow(normalizedR, 2));

       // EDGE BEAD MODEL (Gaussian accumulation)
       const edgeWidth = 0.08 * waferRadius;

       const edgeBead =
         0.6 *
         Math.exp(
           -Math.pow((waferRadius - r) / edgeWidth, 2)
         );

      const localThickness =
        finalH *
        (1 - 0.02 * normalizedR * normalizedR);

      radialProfile.push({
        radius: Number(r.toFixed(1)),
        thickness: Number(localThickness.toFixed(3)),
     });
   }

    const waferRadius_m = waferRadius / 1000;
    const U = omega * waferRadius_m;

    const Re =
      (rho * U * initialThickness * 1e-6) /
      viscosity;

    const Ca =
      (viscosity * U) / sigma;

    const edgeVariation =
      0.5 *
      (waferRadius_m * omega) /
      viscosity *
      0.001;

    const uniformityValue =
      Math.max(
        90,
        100 - edgeVariation
    );

    setFinalThickness(finalH.toFixed(2));
    setReynolds(Re.toFixed(3));
    setCapillary(Ca.toFixed(3));
    setUniformity(
      uniformityValue.toFixed(2)
    );
    setGraphData(results);
    setRadiusData(radialProfile);

    if (evaporation > 0.5) {
      setRegime("Evaporation Dominated");
    } else {
      setRegime("Flow Dominated");
    }
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "auto",
        fontFamily: "Arial",
      }}
    >
      <h1>Spin Coating Simulator</h1>

      <p>
        Emslie–Bonner–Peck (EBP) +
        Meyerhofer Model
      </p>

      <hr />

      <h2>Input Parameters</h2>

      <div>
        <label>Spin Speed (RPM)</label>
        <br />
        <input
          type="number"
          value={rpm}
          onChange={(e) =>
            setRpm(Number(e.target.value))
          }
        />
      </div>

      <br />

      <div>
        <label>Viscosity (Pa·s)</label>
        <br />
        <input
          type="number"
          step="0.01"
          value={viscosity}
          onChange={(e) =>
            setViscosity(Number(e.target.value))
          }
        />
      </div>

      <br />

      <div>
        <label>Evaporation Rate</label>
        <br />
        <input
          type="number"
          step="0.01"
          value={evaporation}
          onChange={(e) =>
            setEvaporation(Number(e.target.value))
          }
        />
      </div>

      <br />

      <div>
        <label>Initial Thickness (μm)</label>
        <br />
        <input
          type="number"
          value={initialThickness}
          onChange={(e) =>
            setInitialThickness(
              Number(e.target.value)
            )
          }
        />
      </div>

      <br />

      <div>
        <label>Wafer Radius (mm)</label>
        <br />
        <input
          type="number"
          value={waferRadius}
          onChange={(e) =>
            setWaferRadius(Number(e.target.value))
          }
        />
      </div>

      <br />

      <button onClick={runSimulation}>
        Run Simulation
      </button>

      {finalThickness && (
        <div style={{ marginTop: "40px" }}>
          <h2>Results</h2>

          <p>
            <strong>
              Final Thickness:
            </strong>{" "}
            {finalThickness} μm
          </p>

          <p>
            <strong>
              Reynolds Number:
            </strong>{" "}
            {reynolds}
          </p>

          <p>
            <strong>
              Capillary Number:
            </strong>{" "}
            {capillary}
          </p>

          <p>
            <strong>Uniformity:</strong>{" "}
            {uniformity} %
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {uniformity >= 98
              ? "✓ Meets ±2% Spec"
              : "✗ Does Not Meet Spec"}
          </p>

          <p>
            <strong>Regime:</strong>{" "}
            {regime}
          </p>

          <h3>
            Thickness Evolution
          </h3>

          <ResponsiveContainer
            width="100%"
            height={400}
          >
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="time"
                label={{
                  value: "Time (s)",
                  position: "insideBottom",
                }}
              />

              <YAxis
                label={{
                  value:
                    "Thickness (μm)",
                  angle: -90,
                  position:
                    "insideLeft",
                }}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="thickness"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          <h3 style={{ marginTop: "40px" }}>
            Radial Thickness Distribution
          </h3>

          <ResponsiveContainer
            width="100%"
            height={400}
          >
            <LineChart data={radiusData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
               dataKey="radius"
               label={{
                 value: "Radius (mm)",
                 position: "insideBottom",
                }}
              />

              <YAxis
                label={{
                  value: "Thickness (μm)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="thickness"
                name="Film Thickness"
                stroke="#ff7300"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;