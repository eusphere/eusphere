---
title: R-factor
author: Adu Bhandaru
date: Apr 30, 2026
description: A model for thinking about the strength of an engineering organization.
---

## Definition

The purpose of an engineering organization is to solve business problems with technology. But its more durable output is a *machine*: a set of manual and increasingly automated processes that sustain the organization’s goals over time.

Let `R` represent the rate at which this machine improves—becoming more effective, efficient, reliable, or capable. We posit here that `R` is the most important measure of engineering strength. In practice, most teams cluster around modest rates of improvement. Teams that sustain very high values of `R` are expensive, difficult to assemble, and predictably scarce.

For example, **a team that makes a machine 1% better each day is an elite, perhaps mythical team**. Sustaining such a rate of improvement requires consistent, intense problem solving, and would result in ~38X the output after 1 year. At 1% per *week*, you are only looking at ~1.7X.

## Abstraction

<figure>
  <img src="/static/pages/r-factor-bell-curve.svg" alt="A bell curve showing the distribution of R, the rate of improvement.">
  <figcaption>AI shifts this curve to the right and flattens.</figcaption>
</figure>

The distribution of `R` across engineering teams is likely centered around a slightly positive value; we use zero here for simplicity. Most teams improve slowly, maintain their current state, or decline slightly. Teams that sustain very high positive values of `R` are rare.

- **`R < 0` – The machine is slowing down.** It may be riddled with accruing tech debt, people may be leaving the team, each day the cost to run things increases, and so on.
- **`R ≈ 0` – The machine is maintaining its current state.** Daily engineering efforts are roughly counteracted by friction, monotonous tasks, and low or no opportunity for automation. This is KTLO in a nutshell.
- **`R > 0` – The machine is speeding up.** Engineering is happening. Automation is proliferating, improvements to the system have longevity, we are building momentum.

A high performance culture is one that:

- Sets ambitious targets for `R` and strongly combats mean reversion.
- Promotes those who make sustained contributions to `R`.

## Contribution

How you move `R` to the right will look different based on your role and seniority. This is actually how things *usually* end up looking; there is **no hard boundary that stops you** from contributing in the same way senior peers do, for example.

<table>
  <thead>
    <tr><th>Leveling</th><th>Common levers</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Managers</td>
      <td><ul><li>Improve your engineers, hire better engineers</li><li>Improve prioritization, context distribution, and delegation</li></ul></td>
    </tr>
    <tr>
      <td>Senior managers</td>
      <td><ul><li>Improve your managers &amp; all the above</li></ul></td>
    </tr>
    <tr>
      <td>L3 &amp; L4</td>
      <td><ul><li>Write features that never break, low maintenance cost</li><li>Improve tools, workflows, escalate tech debt, etc.</li></ul></td>
    </tr>
    <tr>
      <td>L5 &amp; L6</td>
      <td><ul><li>Strengthen your juniors</li><li>Write subsystems that are robust, cheap, observable, and valuable</li></ul></td>
    </tr>
    <tr>
      <td>L7+</td>
      <td><ul><li>Create more L5+ engineers</li><li>Write systems that produce resilient and predictable subsystems</li></ul></td>
    </tr>
  </tbody>
</table>

### Additional notes

- This is not exhaustive. Many of you will find more creative ways to contribute to `R`!
- The `R` a team generates will naturally fluctuate. Breaks must be taken, life happens.
- Example sub-systems: user login, OLAP replication, fraud detection
- Example super-systems: API standardization, React Native, Kubernetes, on-call–the operating ecosystem.

## Prioritization

A common issue that engineers face is not having time to invest in `R`. The alternative is dire—the same problems persist day-to-day and the monotony and lack of “progress” *will* burn out the team. There are only a few ways out and limited time to get the fly-wheel moving.

Some thoughts:

- **An aspiring high-performance team has a short window to achieve `R > 0`.** Think of this as reaching escape velocity. You only have so much fuel—this is the pain your team (together and individually) will tolerate as you pay down debts and work long hours.
- **Contributing to `R` need not require “extra work”.** This is a common misconception. Doing the right work (prioritization) is critical and needs to happen at all levels of the organization. If low `R` work is competing with high `R` work, make your case to leadership. You can see many things they cannot.
- **Investments have the most impact when you make them early.** Switching to the right tooling, ironing out local testing, etc., can all have profound long term effects after compounding. This is true for a given project or job, and even over the course of your career.
- **If you are doing exactly the work given to you, *someone else* is the engineer.** Your job is to first audit the work you receive for upside and reconcile that with your own world model for where opportunities are. If you are diligent here, you *will* find opportunities for optimization—if you get the organization to pursue those instead, you have done engineering.

## Generality

Firstly, this is **just a simple framework** and not some law of physics. I have found it useful in evaluating peers, qualifying gaps in or extraordinary performance, and discussing career growth and promotion. Hopefully it is useful to you.

Second, **anyone can do engineering**. You or I might improve the machine with automation and code. A customer support operator may improve the machine by expanding or refining the canned response library. A chief executive may optimize the relationships within and across organizations themselves. Therefore, you may be able to apply some of the ideas here more broadly.

Finally, AI related advancements do not contradict this framework. Instead, LLMs dramatically flatten the `R` bellcurve and moves it to the right. Improving the machine has never been easier for software engineers and this gives way to new pitfalls: When everything is cheap it is easy to lose discipline when allocating your attention to bottlenecks. **Please prioritize rigorously.**
