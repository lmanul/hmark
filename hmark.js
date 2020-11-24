const CHARTJS = 'https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.min.js';

const COLORS = [
  '#007eca',  // blue
  '#c00000',  // red
  '#ffec00',  // yellow
  '#00ab0b',  // green
];

/** The paths (relative URLs) to test pages. */
let PATHS = [];

/** The actual markup of each test page. */
let PAGES = [];

/** The number of times we want to render each page. */
let RENDER_COUNT = 0;

/** The number of times we have rendered the full list of test pages. */
let CURRENT_RENDER_COUNT = 0;

/** The index of the page we are currently rendering. */
let CURRENTLY_RENDERED_PAGE_INDEX = 0;

/** The ID we use for the repeating interval, useful for stopping it. */
let INTERVAL_ID = 0;

/** Keeps track of measurements:
 * [
 *   [page_a_render_1, page_b_render_2, ...],
 *   [page_b_render_1, page_b_render_2, ...],
 * ]
 */
let TIMINGS = [];

/** The number of pages that we have loaded so far. */
let LOADED = 0;

/** The number of milliseconds we wait in between two renders. */
const SETTLE_DOWN_TIME_MS = 200;

/** Entry point. Starts the process. */
function start(paths, renderCount) {
  const now = new Date().getTime();
  RENDER_COUNT = renderCount;
  PATHS = paths
  for (let i = 0; i < PATHS.length; i++) {
    fetchOnePage(PATHS[i], i, now);
  }

  for (let i = 0; i < PATHS.length; i++) {
    TIMINGS.push([]);
    PAGES.push("");
  }
}

/** Starts fetching the page at the given path.  */
function fetchOnePage(path, index, now) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      onPageLoaded(xhr.response, index);
    }
  }
  const url = path + '?nocache=' + now;
  xhr.open('GET', url, true);
  xhr.send(null);
}

function clear() {
  document.body.innerHTML = '';
}

function render(markup) {
  document.body.innerHTML = markup;
}

function renderSingleSeriesStats(timings) {
  const sum = timings.reduce((a, b) => a + b, 0);
  const average = sum / timings.length;

  // Standard deviation.
  const squaredDiffs = timings.map((v) => (v - average) ** 2);
  const squaredDiffsSum = squaredDiffs.reduce((a, b) => a + b, 0);
  const stdDev = Math.sqrt(squaredDiffsSum / timings.length);

  const rendered = '<big>Rendered ' + timings.length + ' times. ' +
      'Average render time: <b>' + average.toFixed(1) + ' ms.</b> ' +
      'Standard deviation: <b>' + stdDev.toFixed(1) + ' ms.</b></big>';
  return rendered;
}

function bellCurvify(series, min, max) {
  // Construct an object to track how many times a given timing was measured.
  let bell = {};
  for (let i = min; i <= max; i++) {
    bell[i] = 0;
  }
  for (let i = 0; i < series.length; i++) {
    bell[series[i]] += 1;
  }

  let outSeries = [];
  // Now make this into an array.
  for (let i = min; i <= max; i++) {
    outSeries.push(bell[i]);
  }
  return outSeries;
}

function getFileName(path) {
  let filename = path;
  let dir = filename.indexOf('/');
  if (dir != -1) {
    filename = filename.substring(dir + 1);
  }
  return filename;
}

/** Called when we are done and want to show the timings. */
function finish() {
  clear();
  let chartjs = document.createElement('script');
  chartjs.setAttribute('src', CHARTJS);
  chartjs.onload = drawChart;
  document.body.appendChild(chartjs);
  let contents = '';
  for (let i = 0; i < PATHS.length; i++) {
    contents += '<h1>' + getFileName(PATHS[i]) + '</h1>';
    contents += renderSingleSeriesStats(TIMINGS[i]);
  }
  const contentsEl = document.createElement('div');
  contentsEl.innerHTML = contents;
  document.body.appendChild(contentsEl);
}

function drawChart() {
  const canvas = document.createElement('canvas');
  let data = [];
  let min = Infinity;
  let max = 0;
  for (let i = 0; i < TIMINGS.length; i++) {
    let series = TIMINGS[i];
    min = Math.min(min, Math.min(...series));
    max = Math.max(max, Math.max(...series));
  }

  for (let i = 0; i < TIMINGS.length; i++) {
    let series = TIMINGS[i];
    data.push({
      data: bellCurvify(series, min, max),
      label: getFileName(PATHS[i]),

      borderColor: COLORS[i % COLORS.length],
      fill: false
    });
  }
  const context = canvas.getContext('2d');
  let labels = [];
  for (let i = min; i <= max; i++) {
    labels.push('' + i);
  }
  document.body.appendChild(canvas);
  new Chart(context, {
    type: 'line',
    data: {
      labels: labels,
      datasets: data
    },
    options: {}
  });
}


function clearAndSingleRender() {
  clear();
  window.setTimeout(singleRender, SETTLE_DOWN_TIME_MS);
}

/** Performs a single render, and remembers how long it took. */
function singleRender() {
  document.title = '' + CURRENT_RENDER_COUNT + ' — ' + CURRENTLY_RENDERED_PAGE_INDEX;
  const before = new Date().getTime();
  render(PAGES[CURRENTLY_RENDERED_PAGE_INDEX]);
  const after = new Date().getTime();

  const elapsed = after - before;
  TIMINGS[CURRENTLY_RENDERED_PAGE_INDEX].push(elapsed);
  CURRENTLY_RENDERED_PAGE_INDEX++;

  if (CURRENT_RENDER_COUNT >= RENDER_COUNT) {
    window.clearInterval(INTERVAL_ID);
    window.setTimeout(finish, 2 * SETTLE_DOWN_TIME_MS);
  } else {
    if (CURRENTLY_RENDERED_PAGE_INDEX >= PATHS.length) {
      CURRENTLY_RENDERED_PAGE_INDEX = 0;
      CURRENT_RENDER_COUNT++;
    }
  }
}

function benchmark() {
  // We wait 1x SETTLE_DOWN_TIME after clearing, and 1x after rendering.
  INTERVAL_ID = window.setInterval(clearAndSingleRender, 2 * SETTLE_DOWN_TIME_MS);
}

/** Callback for when a page finished loading. */
function onPageLoaded(loadedMarkup, index) {
  PAGES[index] = loadedMarkup;
  LOADED++;
  // If we have loaded all the test pages, we can start.
  if (LOADED === PATHS.length) {
    benchmark();
  }
}
