precision mediump float;
attribute vec3 a_vertex;
attribute vec3 a_normal;
attribute vec2 a_coord;
varying vec2 v_coord;
varying vec3 v_normal;
varying vec3 v_pos;
uniform float u_time;
uniform vec3 u_eye;
uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat4 u_viewprojection;
uniform vec3 u_light_dir;
uniform vec4 u_light_color;
uniform float u_alpha_threshold;
void main() {
      v_coord = a_coord;
      v_normal = (u_model * vec4(a_normal, 0.0)).xyz;
      vec3 pos = a_vertex;
      v_pos = (u_model * vec4(pos,1.0)).xyz;
      gl_Position = u_mvp * vec4(pos,1.0);
}