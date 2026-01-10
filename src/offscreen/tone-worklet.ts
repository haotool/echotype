type AudioWorkletProcessorConstructor = new () => AudioWorkletProcessor;

declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare const sampleRate: number;
declare function registerProcessor(
  name: string,
  processorCtor: AudioWorkletProcessorConstructor
): void;

class ToneProcessor extends AudioWorkletProcessor {
  private frequency = 440;
  private phase = 0;
  private waveType: OscillatorType = 'sine';
  private remainingSamples = 0;
  private totalSamples = 0;
  private started = false;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent) => {
      const { frequency, durationMs, waveType } = event.data || {};
      if (typeof frequency === 'number') {
        this.frequency = frequency;
      }
      if (typeof waveType === 'string') {
        this.waveType = waveType as OscillatorType;
      }
      if (typeof durationMs === 'number') {
        this.totalSamples = Math.max(1, Math.floor((durationMs / 1000) * sampleRate));
        this.remainingSamples = this.totalSamples;
        this.started = true;
      }
    };
  }

  private sampleValue(phase: number): number {
    switch (this.waveType) {
      case 'square':
        return Math.sign(Math.sin(phase)) || 1;
      case 'triangle':
        return (2 / Math.PI) * Math.asin(Math.sin(phase));
      case 'sawtooth':
        return (2 / Math.PI) * (phase % (2 * Math.PI) - Math.PI);
      case 'sine':
      default:
        return Math.sin(phase);
    }
  }

  process(
    _: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const output = outputs[0];
    const channel = output[0];

    if (!this.started || this.remainingSamples <= 0) {
      channel.fill(0);
      if (this.started) {
        this.started = false;
        this.port.postMessage({ type: 'done' });
      }
      return true;
    }

    const fadeOutSamples = Math.floor(sampleRate * 0.02);
    const fadeInSamples = Math.floor(sampleRate * 0.005);
    const phaseStep = (2 * Math.PI * this.frequency) / sampleRate;

    for (let i = 0; i < channel.length; i++) {
      if (this.remainingSamples <= 0) {
        channel[i] = 0;
        continue;
      }

      const elapsed = this.totalSamples - this.remainingSamples;
      let gain = 0.3;
      if (elapsed < fadeInSamples) {
        gain *= elapsed / fadeInSamples;
      }
      if (this.remainingSamples < fadeOutSamples) {
        gain *= this.remainingSamples / fadeOutSamples;
      }

      channel[i] = this.sampleValue(this.phase) * gain;
      this.phase += phaseStep;
      this.remainingSamples -= 1;
    }

    if (this.remainingSamples <= 0) {
      this.port.postMessage({ type: 'done' });
      this.started = false;
    }

    return true;
  }
}

registerProcessor('tone-processor', ToneProcessor);
