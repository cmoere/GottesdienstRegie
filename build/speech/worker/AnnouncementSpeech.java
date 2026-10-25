import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import javax.sound.sampled.*;
import marytts.LocalMaryInterface;

/** Private, local worker: UTF-8 stdin -> finite WAV stdout. No sound device or HTTP server. */
public final class AnnouncementSpeech {
  public static void main(String[] args) throws Exception {
    String voice = args.length == 0 ? "dfki-pavoque-neutral" : args[0];
    if (args.length > 1 || !(voice.equals("dfki-pavoque-neutral") || voice.equals("bits1-hsmm"))) throw new IOException("Invalid voice");
    // Mary libraries may log to stdout. Reserve the original stream for binary output.
    OutputStream audioOutput = new FileOutputStream(FileDescriptor.out);
    System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.err), true, "UTF-8"));
    ByteArrayOutputStream input = new ByteArrayOutputStream();
    byte[] chunk = new byte[4096];
    int count;
    while ((count = System.in.read(chunk)) != -1) {
      if (input.size() + count > 40000) throw new IOException("Input too large");
      input.write(chunk, 0, count);
    }
    String text = new String(input.toByteArray(), StandardCharsets.UTF_8);
    if (text.trim().isEmpty() || text.codePointCount(0, text.length()) > 10000) throw new IOException("Invalid text");
    LocalMaryInterface mary = new LocalMaryInterface();
    mary.setLocale(Locale.GERMAN);
    mary.setVoice(voice);
    AudioInputStream audio = mary.generateAudio(text);
    // Materialize a finite PCM WAV; never open the machine's audio output here.
    ByteArrayOutputStream pcm = new ByteArrayOutputStream();
    while ((count = audio.read(chunk)) != -1) {
      if (pcm.size() + count > 32 * 1024 * 1024 - 128) throw new IOException("Audio too large");
      pcm.write(chunk, 0, count);
    }
    audio.close();
    byte[] samples = pcm.toByteArray();
    AudioFormat format = audio.getFormat();
    AudioInputStream finite = new AudioInputStream(new ByteArrayInputStream(samples), format, samples.length / format.getFrameSize());
    AudioSystem.write(finite, AudioFileFormat.Type.WAVE, audioOutput);
    audioOutput.flush();
  }
}
